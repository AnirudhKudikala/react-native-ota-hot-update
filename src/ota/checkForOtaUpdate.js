import { Alert, Platform } from 'react-native';
import { OTA_GIT_URL } from './config';
import { patchRnfsForIsomorphicGit } from './patchRnfsForIsomorphicGit';

/**
 * Official Git OTA flow from react-native-ota-hot-update:
 * https://github.com/vantuan88291/react-native-ota-hot-update/blob/HEAD/DOC_OTA_GIT.md
 */
export function checkForOtaUpdate() {
  if (__DEV__) {
    return;
  }

  patchRnfsForIsomorphicGit();

  const hotUpdate = require('react-native-ota-hot-update').default;
  const RNFS = require('react-native-fs');

  const run = async () => {
    const dir = `${RNFS.DocumentDirectoryPath}/git_hot_update`;
    const bundleFile =
      Platform.OS === 'ios'
        ? `${dir}/output/main.jsbundle`
        : `${dir}/output/index.android.bundle`;
    // A failed first clone can leave only `.git`. checkForGitUpdate then
    // tries pull instead of clone. Remove it so the documented clone path runs.
    if (
      (await RNFS.exists(`${dir}/.git`)) &&
      !(await RNFS.exists(bundleFile))
    ) {
      hotUpdate.git.removeGitUpdate();
    }

    onCheckGitVersion(hotUpdate);
  };

  run().catch(error => {
    console.error('OTA git check failed', error);
  });
}

function onCheckGitVersion(hotUpdate) {
  hotUpdate.git.checkForGitUpdate({
    branch: Platform.OS === 'ios' ? 'iOS' : 'android',
    bundlePath:
      Platform.OS === 'ios'
        ? 'output/main.jsbundle'
        : 'output/index.android.bundle',
    url: OTA_GIT_URL,
    onCloneFailed(msg) {
      Alert.alert('Clone project failed!', msg, [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ]);
    },
    onCloneSuccess() {
      Alert.alert('Clone project success!', 'Restart to apply the changes', [
        {
          text: 'OK',
          onPress: () => hotUpdate.resetApp(),
        },
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ]);
    },
    onPullFailed(msg) {
      Alert.alert('Pull project failed!', msg, [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ]);
    },
    onPullSuccess() {
      Alert.alert('Pull project success!', 'Restart to apply the changes', [
        {
          text: 'OK',
          onPress: () => hotUpdate.resetApp(),
        },
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ]);
    },
  });
}
