# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 1.0.0 - 2025-06-17

### Changed
- Full release, now requires Node 20

## 0.2.1 - 2024-03-08

### Changed
- Removed source maps.

## 0.2.0- 2024-03-08

### Changed
- Removed dependency on `rfc4648` package and added custom `base32` code instead.

## 0.1.1 - 2024-03-02

### Fixed
- Non-20-byte secrets no longer throw an error when verifying.
- Fixed an error when verifying a code shorter/longer than 6 characters - this now returns `false`. 

## 0.1.0 - 2024-03-01

### Added
- Initial release

