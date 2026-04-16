/**
 * Copyright (c) 2025 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
 
import { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
import { ExpoGaodeMapPackage } from 'expo-gaode-map';
export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  console.info('[RNPackagesFactory] createRNPackages');
  return [
    new ExpoGaodeMapPackage(ctx),
  ];
}
