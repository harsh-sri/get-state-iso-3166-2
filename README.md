
# Base Zipcode ISO3166-2

ZipUtil to get the state in ISO3166-2 format based on Country & Zip code.

### Install

```bash
npm i get-state-iso2 --save
```

### Usage

Import 

```
const ZipUtil = require('get-state-iso2').default
```

Initialize ZipUtil by passing configuration object in load function
```
ZipUtil.init({supportedCountries: ['IN'], supportedCountryOnly: true});
```

To get the state
```
await ZipUtil.getInstance().getState('NL', '1016 DC');
await ZipUtil.getInstance().getState('IN', '110016');
```

### License
MIT
