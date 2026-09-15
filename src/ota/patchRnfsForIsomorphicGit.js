/**
 * @dr.pogodin/react-native-fs throws iOS errors like:
 *   The file "config" couldn't be opened because there is no such file.
 * isomorphic-git (used by react-native-ota-hot-update) only treats missing
 * files as recoverable when err.code === 'ENOENT'.
 */
export function patchRnfsForIsomorphicGit() {
  const RNFS = require('react-native-fs');
  patchModule(RNFS);
  patchModule(RNFS?.default);
}

function patchModule(mod) {
  if (!mod || mod.__otaEnoentPatched || typeof mod.readFile !== 'function') {
    return;
  }
  mod.__otaEnoentPatched = true;

  const wrap =
    fn =>
    async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (isMissingFileError(error)) {
          const err = new Error(
            `ENOENT: no such file or directory, open '${String(args[0])}'`,
          );
          err.code = 'ENOENT';
          throw err;
        }
        throw error;
      }
    };

  mod.readFile = wrap(mod.readFile.bind(mod));
  if (typeof mod.stat === 'function') {
    mod.stat = wrap(mod.stat.bind(mod));
  }
  if (typeof mod.unlink === 'function') {
    mod.unlink = wrap(mod.unlink.bind(mod));
  }
  if (typeof mod.readdir === 'function') {
    mod.readdir = wrap(mod.readdir.bind(mod));
  }
}

function isMissingFileError(error) {
  const message = String(
    error instanceof Error ? error.message : error,
  ).toLowerCase();
  return (
    message.includes('no such file') ||
    message.includes('file does not exist') ||
    message.includes('folder does not exist') ||
    message.includes("couldn't be opened") ||
    message.includes('couldn’t be opened')
  );
}
