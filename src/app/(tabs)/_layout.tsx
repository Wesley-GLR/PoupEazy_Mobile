import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors, fontFamily } from '@/theme';

export default function TabsLayout() {
  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={colors.surface}
      iconColor={{ default: colors.textMuted, selected: colors.primary }}
      indicatorColor={colors.primarySoft}
      labelStyle={{ fontFamily: fontFamily.bodyMedium, fontSize: 11 }}
      tintColor={colors.primary}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(transactions)">
        <NativeTabs.Trigger.Label>Transações</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'arrow.left.arrow.right', selected: 'arrow.left.arrow.right.circle.fill' }} md="swap_horiz" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(budget)">
        <NativeTabs.Trigger.Label>Orçamento</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'wallet.bifold', selected: 'wallet.bifold.fill' }} md="account_balance_wallet" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(goals)">
        <NativeTabs.Trigger.Label>Metas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="target" md="track_changes" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(more)">
        <NativeTabs.Trigger.Label>Mais</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="ellipsis.circle" md="more_horiz" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
