import React from 'react';
import { View } from 'react-native';

interface AppSpacerProps {
  vertical?: number; // height
  horizontal?: number; // width
}

const AppSpacer: React.FC<AppSpacerProps> = ({
  vertical = 0,
  horizontal = 0,
}) => <View style={{ height: vertical, width: horizontal }} />;

export default AppSpacer;
