---
'@chainfuse/types': patch
---

Add `D0ShardType.Memory` for the dataspace Agent Memory shard. d0 already references it, which evaluated to `undefined` at runtime and made the dataspace director's memory shard lookup match any shard type.
