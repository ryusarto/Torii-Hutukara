#!/usr/bin/env python3
"""Wait for the exact uploaded artifact to be visible to deploy-pages' REST lookup."""
import json
import os
import time
import urllib.error
import urllib.request


def matching_artifact(payload, expected_name, expected_id):
    named = [a for a in payload.get('artifacts', [])
             if a.get('name') == expected_name and not a.get('expired', False)]
    exact = [a for a in named if str(a.get('id')) == str(expected_id)]
    if exact and len(named) != 1:
        raise RuntimeError('Pages artifact name is ambiguous; refusing deployment')
    return exact[0] if len(exact) == 1 else None


def wait_for_artifact(fetch, expected_name, expected_id, attempts=12, interval=5, sleep=time.sleep):
    if not expected_name or not str(expected_id).isdigit():
        raise ValueError('The upload must provide a nonempty name and numeric artifact_id')
    for attempt in range(attempts):
        try:
            artifact = matching_artifact(fetch(), expected_name, expected_id)
            if artifact:
                return artifact
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504):
                raise
        if attempt + 1 < attempts:
            sleep(interval)
    raise RuntimeError('Uploaded Pages artifact did not become visible within the bounded wait')


def main():
    token = os.environ['GH_TOKEN']
    repository = os.environ['GITHUB_REPOSITORY']
    run_id = os.environ['GITHUB_RUN_ID']
    expected_name = os.environ['PAGES_ARTIFACT_NAME']
    expected_id = os.environ['PAGES_ARTIFACT_ID']
    url = f'https://api.github.com/repos/{repository}/actions/runs/{run_id}/artifacts?per_page=100'

    def fetch():
        request = urllib.request.Request(url, headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Torii-Hutukara-pages-readiness',
        })
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.load(response)

    artifact = wait_for_artifact(fetch, expected_name, expected_id)
    print(f"Pages artifact ready: {artifact['name']} (id {artifact['id']})")


if __name__ == '__main__':
    main()
