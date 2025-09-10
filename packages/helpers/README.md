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

## UUIDv8

Based on UUIDv7 but with added values to prevent unnecessary lookups

`01f3ffff-fc18-8bb7-9120-cabc55668d92`

| 01f3ffff-fc18                             | 8            | bb7                               | 9                                | 12                                       | 0           | cabc55668d92   |
| ----------------------------------------- | ------------ | --------------------------------- | -------------------------------- | ---------------------------------------- | ----------- | -------------- |
| 48bit Timestamp (Unix epoch milliseconds) | UUID Version | Suffix random (`000` if director) | variant (2 bits) + 2 random bits | `DOCombinedLocations` (`00` if anywhere) | `ShardType` | 48 random bits |
