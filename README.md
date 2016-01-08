# notational momentum

a mouseless, *truly* modal notetaker that opens your notes in vim,

ultralite clone of [notational velocity](http://notational.net/) 

may it serve you well

## installation

    npm install -g notational-momentum

## usage

    notational-momentum

will open up the current directory.

navigate to a note with ctrl-J / ctrl-K, press enter to open the note in vim.

you can specify a custom directory with `-d`,
and you can specify a custom program with which to open notes with `-p`

    notational-momentum -d ~/Notes -p emacs

or

    notational-momentum -d ~/Notes -p subl

where ~/Notes is some directory filled with files that can be opened in emacs.

## controls

### CTRL+J 

navigate down

### CTRL+K 

navigate up

### type

search notes

### ENTER

open selected note in vim

## license

BSD-2-Clause
