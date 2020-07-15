import * as papa from 'papaparse';
import * as admZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
// Interfaces
import IConfig from './interfaces/IConfig';
import IGetStateResponse from './interfaces/IGetStateResponse';
import IBuildDataResponse from './interfaces/IBuildDataResponse';
import IProcessRowResponse from './interfaces/IProcessRowResponse';

const countryWiseTransformations = {
    'NL' : function(zip: string) { return zip.substring(0, 4)},
} as any;
const regionSelector = {
    'GB': 5
} as any;
const papaConfigOptions = {
    header: false,
    delimiter: '\t',
};

export default class ZipUtil {
    private static _instance: ZipUtil;
    private readonly config: IConfig;
    private readonly allCountriesFilePath = path.resolve(__dirname, '../', '../', 'data', 'allCountries.txt');
    private readonly allCountriesZipFilePath = path.resolve(__dirname, '../', '../', 'data', 'allCountries.txt.zip');
    private readonly regionDataFilePath = path.resolve(__dirname, '../', '../', 'data', 'iso-3166-2.json');
    private store: any;
    private constructor(config: IConfig){
        this.config = config;
        if(!fs.existsSync(this.allCountriesFilePath)) {
            console.log('----- FILE DOES NOT EXISTS -----');
            const admZ = new admZip(this.allCountriesZipFilePath);
            const zipEntries = admZ.getEntries(); // an array of ZipEntry records
            const self = this;
            zipEntries.forEach(function(zipEntry) {
                if (zipEntry.entryName == "allCountries.txt") {
                    fs.writeFileSync(self.allCountriesFilePath, zipEntry.getData().toString('utf8'), 'utf-8')
                }
            })
        } else {
            console.log('Extracted File already exists...');
        }

    }

    /**
     * Description:  Initialize the ZipUtil and create a instance
     * @param config - IConfig
     *
     */
    public static init(config: IConfig) {
        if (!this._instance) {
            this._instance = new ZipUtil(config);
        }
    }

    /**
     * Description:  Get the instance of ZipUtil
     * @error - throws error if init is not called.
     */
    public static getInstance(): ZipUtil {
        if (this._instance) {
            return this._instance;
        }
        throw new Error('Invoke init() before calling getInstance()');
    }

    /**
     *
     * @param {supportedCountries} - Array of countries eg ['NL', 'US']
     * @param {supportedCountriesOnly} - Boolean to restrict the build data process to run only for supported countries
     * @returns {dataByRegion}
     */
    private async makeRegionCodeMap(supportedCountries:Set<string>, supportedCountriesOnly: boolean): Promise<Array<string>> {
        const regionData = JSON.parse(fs.readFileSync(this.regionDataFilePath, 'utf-8'));
        const countries = Object.keys(regionData);
        const dataByRegion = {} as any;
        countries.forEach((country) => {
          if (supportedCountriesOnly && !supportedCountries.has(country)) return;
          const regionIsoCodes =  Object.keys(regionData[country].divisions);
          regionIsoCodes.forEach((isoCode)=>{
            const region = regionData[country].divisions[isoCode];
            if (!dataByRegion[country]) {
                dataByRegion[country] = {}
            }
            const [countryCode, stateCode] = isoCode.split('-');
            dataByRegion[country][region] = stateCode;
          })
        });
        return dataByRegion;
    }

    /**
     *
     * @param country 2 digit country code
     * @param zip zipcode
     * @returns Normalized zipcode using helper function country transformation
     */
    private async normalizeZipCode(country: string, zip: string): Promise<string> {
        const [first, ...second] = zip.split(' ');

        if (countryWiseTransformations[country]) return countryWiseTransformations[country](first);
        return first;
    }

    /**
     *
     * @param row - A row from csv/text file to process
     * @returns - returns Object with zip, country and state data
     */
    private processRow(row: string): IProcessRowResponse {
        const country = row[0];
        const region = regionSelector[country] || 3;
        // Sample: NL	1181	Amstelveen	Noord-Holland	07	Amstelveen	0362			52.31	4.8631	6
        return {
            zip: row[1],
            country: row[0],
            data: {
                state: row[region],
                raw: row
            }
        };
    }

    /**
     *
     * @param {$supportedCountries} - Array of countries eg ['NL', 'US']
     * @param {supportedCountriesOnly} - Boolean to restrict the build data process to run only for supported countries
     * @returns {Object} Country data by zip and region
     */
    private buildData($supportedCountries: string[], supportedCountriesOnly: boolean): Promise<IBuildDataResponse> {
        const supportedCountries = new Set($supportedCountries);
        return new Promise((resolve, rejects) => {
            const dataStream = fs.createReadStream(this.allCountriesFilePath);
            const parseStream = papa.parse(papa.NODE_STREAM_INPUT, papaConfigOptions);
            dataStream.pipe(parseStream);
            let dataByZip = {} as any;
            parseStream.on('data', (chunk) => {
                const { zip, country, data } = this.processRow(chunk);
                if (supportedCountriesOnly && !supportedCountries.has(country)) {
                    return;
                }
                if (!dataByZip[country]) {
                    dataByZip[country] = {};
                }
                dataByZip[country][zip] = data;
            });
            parseStream.on('finish', async () => {
                const dataByRegion = await this.makeRegionCodeMap(supportedCountries, supportedCountriesOnly);
                resolve({ zmap: dataByZip, rmap: dataByRegion });
            });
        })
    }

    /**
     *
     * @param country: 2-digit code of the country
     * @param zipcode: zipcode
     * @returns State in ISO3166-2 format
     */
    public async getState(country: string, zipcode: string): Promise<IGetStateResponse> {
        const { supportedCountryOnly, supportedCountries } = this.config;
        if (
            supportedCountryOnly &&
            supportedCountries.indexOf(country) === -1
        ) {
            return {
                state: ''
            }
        }
        if (!this.store) {
            console.log('store does not exists, lets create one');
            this.store = await this.buildData(supportedCountries, supportedCountryOnly);
        }
        
        zipcode = await this.normalizeZipCode(country, zipcode);
        const state = this.store.zmap[country][zipcode] ? this.store.zmap[country][zipcode].state : '';
        const isoCode = this.store.rmap[country][state] ? this.store.rmap[country][state] : '' ;
        return {
            state: isoCode
        }
    }
}
