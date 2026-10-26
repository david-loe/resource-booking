import assert from 'node:assert/strict'
import { test } from 'node:test'
import { JSONPath } from 'jsonpath-plus'

test('JSONPath replacement preserves recursive resource and name queries', () => {
  const available = [{ resource: { name: 'Room A' } }, { resource: { name: 'Room B' } }]
  const resources = JSONPath({ json: available, path: '$..resource', eval: false })
  assert.deepEqual(resources, [{ name: 'Room A' }, { name: 'Room B' }])
  assert.deepEqual(JSONPath({ json: resources, path: '$..name', eval: false }), ['Room A', 'Room B'])
  assert.deepEqual(JSONPath({ json: [], path: '$..name', eval: false }), [])
})
