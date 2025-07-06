# lang64K
A simple assembly-like language for PC64K.

## Syntax

|token|meaning|usage|
|-|-|-|
|`; text`|A single-line comment|`; Hello World!`|
|`$0` - `$f`|Registers `R0` - `Rf`|`$5`|
|`$i`|`Ri`, the RAM pointer|`$i`|
|`$j`|`Rj`, the disk pointer|`$j`|
|`[0x/0b]number`|A number / an address|`10`, `0x0a`, `0b1010`|
|`*[0x/0b]number`|A value at RAM address|`*0`, `*0x20`|
|`^[0x/0b]number`|A value at disk address|`^0`, `^0x20`|
|`'c'`|A character, just like in C|`'a'`, `'\\'`, `'\b'`|
|`"text"`|A string|`"Hello World!\r\n"`|
|`h"hextext"`|A quoted hex string<sup>1</sup><sup>2</sup>|`h"015b"`|
|`[section]`|Section marker|`[main]`|
|`text`|Instruction or section name|`goto`, `main`|

#### Notes
1. Can't be used interchangeably with `0xnumber`
2. Length in characters has to be divisible by 2

## Example
```
[main]
add $0 1 ; Adds 1 to R0
keygo $0 handle ; If key at $0 is pressed, go to [handle]
goto main ; Loop

[handle]
call print ; Calls function at [print]
[loop]
keygo $0 loop ; Loop while the current key is pressed down
goto main ; Goes back to [main]

[print]
neqgo $0 0x08 print_skip ; If R0 != '\b', skip erasing last character and go to [print_skip]
print sys $0 ; Go back one character
print sys ' ' ; Print space to fill the previous character's space
[print_skip]
print sys $0 ; Prints the character
ret ; Returns back to [handle]
```

## Instructions
For more context, see [opcodes docs](https://pc64k.github.io/docs/opcodes.html).

|instruction|meaning|example|
|-|-|-|
|`print sys`|Prints a system character|`print sys $2`|
|`print custom`|Prints a custom character|`print custom $2`|
|`db`|Simply stores data from hex/string as binary data|`db h"cafebabe"`|
|`goto`|Jumps to an address|`goto loop`|
|`set $i`|Sets `Ri` to a value|`set $i 0x1234`|
|`set $j`|Sets `Rj` to a value|`set $j 0x5678`|
|`set *0x1234`|Sets value at RAM addr<sup>1</sup>|`set *0x1234 $a`|
|`set ^0x5678`|Sets value at disk addr<sup>1</sup>|`set ^0x5678 $b`|
|`set $x`|Sets `Rx` to a value|`set $a 0x55`|
|`disksize`|Gets disk size and stores it in RAM<sup>1</sup>|`disksize 0x1234`|
|`add $x`|Adds a value to a register|`add $7 5`|
|`add $i/$j`|Adds a value to a RAM/disk pointer|`add $i 5`|
|`sub $x`|Subtracts a value from a register|`sub $7 $4`|
|`sub $i/$j`|Subtracts a value from a RAM/disk pointer|`sub $j 5`|
|`subi`|Subtracts a register's value from another value|`subi $6 5`|
|`mul`|Multiplies a register's value by another value|`mul $6 5`|
|`or`|Does a bitwise OR with a register's value and another value|`or $2 $3`|
|`and`|Does a bitwise AND with a register's value and another value|`and $2 $3`|
|`xor`|Does a bitwise XOR with a register's value and another value|`or $2 0b00001111`|
|`rshift`|Does a bitwise right shift with a register's value and another value|`rshift $2 1`|
|`lshift`|Does a bitwise left shift with a register's value and another value|`lshift $2 1`|
|`ret`|Returns from a function|`ret`|
|`call`|Calls a function|`call print`|
|`pop`|Pops a value from stack and saves it to an address in RAM|`pop 0x1234`|
|`push`|Pushes a value from a RAM address to the stack|`push 0x1234`|
|`eqgo`|If two values are equal, jumps to address|`eqgo $1 $2 0x1234`|
|`neqgo`|If two values are not equal, jumps to address|`eqgo $1 50 0x1234`|
|`morego`|If value 1 is greater than value 2, jumps to address|`morego $1 $2 0x1234`|
|`lessgo`|If value 1 is less than value 2, jumps to address|`morego $1 50 0x1234`|
|`moreeqgo`|If value 1 is greater than or equal to value 2, jumps to address|`moreeqgo $1 $2 0x1234`|
|`lesseqgo`|If value 1 is less than pr equal to value 2, jumps to address|`moreeqgo $1 50 0x1234`|
|`color`|Sets foreground and background color respectively<sup>2</sup>|`color $1 $2`|
|`timfreq delay`|Sets the delay timer's frequency<sup>2</sup>|`timfreq delay $1`|
|`timfreq sound`|Sets the sound timer's frequency<sup>2</sup>|`timfreq sound $1`|
|`timset delay`|Sets the delay timer's value<sup>2</sup>|`timset delay $1`|
|`timset sound`|Sets the sound timer's value<sup>2</sup>|`timset sound $1`|
|`timget delay`|Gets the delay timer's value<sup>2</sup>|`timget delay $1`|
|`timget sound`|Gets the sound timer's value<sup>2</sup>|`timget sound $1`|
|`timjoin delay`|Waits until the delay timer reaches 0|`timjoin delay`|
|`timjoin sound`|Waits until the delay timer reaches 0|`timjoin ound`|
|`charset`|Sets a custom character from RAM<sup>1</sup>|`charset 'a' 0x1234`|
|`keygo`|If the specified key is pressed, goes to address|`keygo $1 0x1234`|
|`clear`|Clears display|`clear`|
|`printxy`|Goes to coordinates (`Rx`, `Ry`) for printing|`printxy $5 $6`|
|`copy ^0x1234 *0x5678 $x`|Copies `Rx` bytes from disk to RAM<sup>1</sup>|`copy ^0x1234 *0x5678 $5`|
|`copy *0x1234 ^0x5678 $x`|Copies `Rx` bytes from RAM to disk<sup>1</sup>|`copy *0x1234 ^0x5678 $5`|

#### Notes
1. Only supports raw addresses like `0x1234`, not labels like `loop`
2. ONLY supports registers