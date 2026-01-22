# PL/I Preprocessor CLI

A command-line tool to run the PL/I preprocessor on PL/I source files.

## Usage

You can run the preprocessor CLI using the following command:

```bash
pl1-preprocessor -i <input_file> [-o <output_file>]
```

- `-i <input_file>`: The path to the input PL/I source file.
- `-o <output_file>`: The path to the output file. If not specified, the output is printed to the standard output.

## Configuration

The preprocessor relies on the Zowe Explorer PL/I extension configuration to resolve includes and other settings.
It looks for a `.pliplugin` directory in the input file's directory or any of its parent directories.

If a configuration is found, it will be used. Otherwise, default settings will be used, which might fail to resolve includes if they are not in the standard locations or require specific search paths.

## Example

```bash
pl1-preprocessor -i myprogram.pli -o myprogram.preprocessed.pli
```
