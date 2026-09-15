import { Platform } from 'react-native';
import { OTA_GIT_URL } from './config';

export function checkForOtaUpdate(): void {
  if (__DEV__) {
    return;
  }

  if (!OTA_GIT_URL || OTA_GIT_URL.includes('AnirudhKudikala')) {
    console.warn(
      'OTA Git URL is not configured. Set OTA_GIT_URL in src/ota/config.ts.',
    );
    return;
  }

  // Lazy-load so Jest / Metro debug do not initialize the native module.
  const hotUpdate = (
    require('react-native-ota-hot-update') as typeof import('react-native-ota-hot-update')
  ).default;

  hotUpdate.git.checkForGitUpdate({
    url: OTA_GIT_URL,
    branch: Platform.OS === 'ios' ? 'iOS' : 'android',
    bundlePath:
      Platform.OS === 'ios'
        ? 'output/main.jsbundle'
        : 'output/index.android.bundle',
    restartAfterInstall: true,
    onCloneFailed: (msg: string) => {
      console.error('OTA clone failed', msg);
    },
    onPullFailed: (msg: string) => {
      if (msg !== 'No updated') {
        console.error('OTA pull failed', msg);
      }
    },
  });
}
