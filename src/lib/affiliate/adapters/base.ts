import { networks, type NetworkId } from '../networks';
import {
  AdapterNotConfiguredError,
  AdapterNotImplementedError,
  type AffiliateAdapter,
  type FetchOffersOptions,
  type NormalizedOffer,
  type NormalizedProgram,
} from '../types';

type Env = Record<string, string | undefined>;

/**
 * Shared scaffolding for network adapters: credential checks and a clear error
 * where API mapping still has to be written against current documentation.
 */
export function createAdapter(
  network: NetworkId,
  impl: {
    listPrograms?: (env: Env) => Promise<NormalizedProgram[]>;
    fetchOffers?: (env: Env, options?: FetchOffersOptions) => Promise<NormalizedOffer[]>;
  } = {},
): AffiliateAdapter {
  const info = networks[network];
  const requiredEnv = info.credentials;
  const missing = (env: Env) => requiredEnv.filter((k) => !env[k]);
  const ensure = (env: Env) => {
    const m = missing(env);
    if (m.length) throw new AdapterNotConfiguredError(network, m);
  };
  return {
    network,
    requiredEnv,
    isConfigured: (env) => missing(env).length === 0,
    async listPrograms(env) {
      ensure(env);
      if (!impl.listPrograms) throw new AdapterNotImplementedError(network, 'listPrograms', info.docsUrl);
      return impl.listPrograms(env);
    },
    async fetchOffers(env, options) {
      ensure(env);
      if (!impl.fetchOffers) throw new AdapterNotImplementedError(network, 'fetchOffers', info.docsUrl);
      return impl.fetchOffers(env, options);
    },
  };
}
