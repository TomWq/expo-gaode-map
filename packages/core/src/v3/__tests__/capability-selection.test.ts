import { resolveCapabilityModuleSelection } from '../capability-selection';

describe('v3 capability selection', () => {
  it('should keep both modules enabled by default', () => {
    expect(resolveCapabilityModuleSelection()).toEqual({
      nativeSearch: true,
      webApi: true,
    });
  });

  it('should enable web provider when route capability is required', () => {
    expect(
      resolveCapabilityModuleSelection({
        requirements: {
          route: true,
        },
      })
    ).toEqual({
      nativeSearch: false,
      webApi: true,
    });
  });

  it('should prefer native provider for search/geocode by default', () => {
    expect(
      resolveCapabilityModuleSelection({
        requirements: {
          search: true,
          geocode: true,
        },
      })
    ).toEqual({
      nativeSearch: true,
      webApi: false,
    });
  });
});
