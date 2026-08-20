# TODO

- [ ] Handle offer parsing from cyclic FTP deliveries: use a staged upload / completion marker, detect the complete delivery set, parse it once, and retain delivery metadata so incomplete or repeated uploads cannot overwrite the current published offers.

- [ ] Set up restorative processes and configure env variables on the VPS