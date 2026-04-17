#!/usr/bin/env python3
# Entrypoint legacy. Logica spostata in itatorrents/ package.
# Esegui via: itatorrents -u FILE  (dopo pip install -e .)
from itatorrents.cli import main

if __name__ == "__main__":
    main()
