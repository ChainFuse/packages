[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/ChainFuse/packages/badge)](https://securityscorecards.dev/viewer/?uri=github.com/ChainFuse/packages)[![Socket Badge](https://socket.dev/api/badge/npm/package/@chainfuse/helpers)](https://socket.dev/npm/package/@chainfuse/helpers)

![NPM Downloads](https://img.shields.io/npm/dw/@chainfuse/helpers)![npm bundle size](https://img.shields.io/bundlephobia/min/@chainfuse/helpers)![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/@chainfuse/helpers)

[![Build & Test](https://github.com/ChainFuse/packages/actions/workflows/test.yml/badge.svg)](https://github.com/ChainFuse/packages/actions/workflows/test.yml)[![Release](https://github.com/ChainFuse/packages/actions/workflows/changeset-release.yml/badge.svg)](https://github.com/ChainFuse/packages/actions/workflows/changeset-release.yml)

# `@chainfuse/helpers`

> TODO: description

## Usage

```
import helpers from '@chainfuse/helpers';

// TODO: DEMONSTRATE API
```

## SuruID

In Japanese, する (suru) is a versatile, irregular verb meaning "to do"

384 bit long id (max 64 characters as base64, 96 as hex)

| Format          | Example                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hex             | `11f3fffffc18001000000036a0ea9c0d7d27581ebf4876defd304469119f0f4cfc41b0fb96d6b1e18900ec4522706e3aa`                                                                     |
| SQLite Blob     | `17243255255252240160005416023415613125398830191721182222534868105171591576252651762511502141772251370236693411211058`                                                  |
| JS Buffer Array | `[17,243,255,255,252,24,0,16,0,0,0,54,160,234,156,13,125,39,88,30,191,72,118,222,253,48,68,105,17,159,15,76,252,65,176,251,150,214,177,225,137,0,236,69,34,112,110,58]` |
| base64          | `EfP///wYABAAAAA2oOqcDX0nWB6/SHbe/TBEaRGfD0z8QbD7ltax4YkA7EUicG46`                                                                                                      |
| base64url       | `EfP___wYABAAAAA2oOqcDX0nWB6_SHbe_TBEaRGfD0z8QbD7ltax4YkA7EUicG46`                                                                                                      |

### Breakdown

| Offset (bits) | Size (bits) | Field         | (Hex) Example                                                      | Notes                                                                |
| ------------- | ----------- | ------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 0             | 4           | Version       | `1`                                                                | Masked into timestamp's top nibble                                   |
| 4             | 44          | Timestamp     | `1f3fffffc18`                                                      | Lower 44 bits of 48bit epoch milliseconds                            |
| 48            | 12          | System Type   | `001`                                                              | TODO Enum                                                            |
| 60            | 4           | Environment   | `0`                                                                | TODO Enum                                                            |
| 64            | 12          | Location      | `000`                                                              | `DOCombinedLocations` TS Enum                                        |
| 76            | 8           | Shard Type    | `000`                                                              | `ShardType` TS Enum                                                  |
| 84            | 256         | Stable random | `36a0ea9c0d7d27581ebf4876defd304469119f0f4cfc41b0fb96d6b1e18900ec` | Stable per logical entity; correlates related IDs without DB lookups |
| 340           | 44          | Suffix        | `4522706e3aa`                                                      | Fresh entropy per ID to ensure uniqueness even if other fields match |
