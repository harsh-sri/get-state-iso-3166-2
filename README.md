
# Base Zipcode ISO3166-2

ZipUtil to get the state in ISO3166-2 format based on Country & Zip code.(Not ready Yet)

### Install

```bash
npm i get-state-iso2 --save
```

### Usage

Initialize ZipUtil by passing configuration object in load function
```
ZipUtil.load({supportedCountries: ['NL'], supportedCountryOnly: true})
```

To get the state
```
ZipUtil.getInstance().getState('NL', '1016 AB')
```

### License
ISC
