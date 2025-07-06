# lang
lang64K is an assembly-like programming language for PC64K

For docs, see [docs/](docs/index.md).

## Installation
```sh
npm i -g lang64k
```
## Usage
```sh
lang64k [-f <c | hex | binary>] <files...> [-o <outfile>]
```
## `-f` Format
Will specify the format:
- `c` will output a C-style array with the ROM
- `hex` will output a hex string with the ROM
- `binary` will output the raw binary
## `-o` Output file
Will save the output to the specified file.