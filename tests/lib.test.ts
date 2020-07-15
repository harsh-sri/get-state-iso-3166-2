import { expect } from 'chai';
import { describe, it } from 'mocha';
import ZipUtil from '../lib/index';

before(async () => {
  ZipUtil.init({ supportedCountries: ['GB', 'NL'], supportedCountryOnly: true});
});

describe('zipCode: GB', () => {
  it('Get state based on Country and ZipCode- GB-HU12', async () => {
    const { state } = await ZipUtil.getInstance().getState('GB', 'HU12');
    expect(state).to.equal('ERY');
  });
  it('Get state based on Country and ZipCode- GB-YO25', async () => {
    const { state } = await ZipUtil.getInstance().getState('GB', 'YO25');
    expect(state).to.equal('NYK');
  });
  it('Operation not allowed based on unsupported country value', async () => {
    const { state } = await ZipUtil.getInstance().getState('IN', '1025 DB');
    expect(state).to.be.lengthOf(0);
  });
});


describe('zipCode: NL', () => {
  it('Get state based on Country and ZipCode- NL-1025 AB', async () => {
    const { state } = await ZipUtil.getInstance().getState('NL', '1025 AB');
    expect(state).to.equal('NH');
  });
  it('Get state based on Country and ZipCode- NL-1025 DN', async () => {
    const { state } = await ZipUtil.getInstance().getState('NL', '1025 DN');
    expect(state).to.equal('NH');
  });
});

