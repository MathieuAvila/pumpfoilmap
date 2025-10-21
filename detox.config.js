/**
 * Detox configuration for Android emulator (debug)
 */
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/native/jest.config.js',
  specs: 'e2e/native/**/*.e2e.ts',
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'
    }
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_3a_API_34_x86_64'
      }
    }
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  }
};
