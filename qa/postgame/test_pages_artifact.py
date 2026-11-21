import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('pages_ready', Path(__file__).resolve().parents[2] / 'production/wait_pages_artifact.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PagesReadiness(unittest.TestCase):
    target = {'id': 42, 'name': 'github-pages-100-2', 'expired': False}

    def test_old_artifact_is_not_selected(self):
        self.assertIsNone(module.matching_artifact({'artifacts': [{'id': 1, 'name': 'github-pages'}]}, self.target['name'], 42))

    def test_id_and_name_must_both_match(self):
        self.assertIsNone(module.matching_artifact({'artifacts': [{**self.target, 'id': 41}]}, self.target['name'], 42))
        self.assertIsNone(module.matching_artifact({'artifacts': [{**self.target, 'name': 'github-pages-100-1'}]}, self.target['name'], 42))

    def test_expired_target_is_not_ready(self):
        self.assertIsNone(module.matching_artifact({'artifacts': [{**self.target, 'expired': True}]}, self.target['name'], 42))

    def test_exact_target_is_ready_among_old_attempts(self):
        payload = {'artifacts': [{'id': 1, 'name': 'github-pages'}, {'id': 2, 'name': 'github-pages'}, self.target]}
        self.assertEqual(module.matching_artifact(payload, self.target['name'], '42'), self.target)

    def test_duplicate_target_name_is_rejected(self):
        with self.assertRaises(RuntimeError):
            module.matching_artifact({'artifacts': [self.target, {**self.target, 'id': 43}]}, self.target['name'], 42)

    def test_eventual_visibility_is_retried_without_reupload(self):
        rows = iter([{'artifacts': []}, {'artifacts': [{'id': 1, 'name': 'github-pages'}]}, {'artifacts': [self.target]}])
        pauses = []
        result = module.wait_for_artifact(lambda: next(rows), self.target['name'], 42, attempts=3, sleep=pauses.append)
        self.assertEqual(result, self.target)
        self.assertEqual(pauses, [5, 5])

    def test_timeout_does_not_choose_another_artifact(self):
        with self.assertRaises(RuntimeError):
            module.wait_for_artifact(lambda: {'artifacts': []}, self.target['name'], 42, attempts=2, sleep=lambda _: None)

    def test_missing_upload_id_fails_before_poll(self):
        with self.assertRaises(ValueError):
            module.wait_for_artifact(lambda: self.fail('should not fetch'), self.target['name'], '')


if __name__ == '__main__':
    unittest.main()
