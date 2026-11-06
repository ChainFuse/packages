---
'@chainfuse/helpers': patch
---

`SuruId.suruCreate` / `suruCreateSync` drew their default `suffixRandom` and `stableRandom` once per process instead of once per call: the byte-length `.check()` sat on the `_default` wrapper, and cloning the schema evaluated the default getter a single time. The check now sits on the input union, so every call without an explicit random gets fresh bytes.
