import React, { useCallback, useMemo } from 'react';
import { Box, Flex, Stack } from '@nelson-ui/react';
import { Text } from '../text';
import { styled } from '@stitches/react';
import {
  outboundSwapStorageState,
  SwapListItem,
  useInboundSwapStorage,
} from '../../common/store/swaps';
import { satsToBtc, truncateMiddle } from '../../common/utils';
import format from 'date-fns/format';
import { StatusButton } from '../button';
import { useRouter } from 'next/router';
import { useQueryAtom } from 'jotai-query-toolkit';
import { Spinner } from '../spinner';
import { useStxTxResult } from '../../common/store/api';
import { useFinalizedOutboundSwap } from '../../common/store';
import { DuplicateIcon } from '../icons/duplicate';

const SwapRowComp = styled(Box, {
  borderBottom: '1px solid $color-border-subdued',
  borderLeft: '1px solid $color-border-subdued',
  borderRight: '1px solid $color-border-subdued',
  padding: '20px 28px',
  width: '100%',
  '&:first-child': {
    borderTop: '1px solid $color-border-subdued',
    borderTopLeftRadius: '$extra-large',
    borderTopRightRadius: '$extra-large',
    // borderRadius: '$extra-large $extra-large 0 0',
  },
  '&:last-child': {
    borderBottomLeftRadius: '$extra-large',
    borderBottomRightRadius: '$extra-large',
  },
});

interface RowProps {
  id: string;
  dir: SwapListItem['dir'];
  amount: string;
  status: 'success' | 'pending';
  buttonText?: string;
  route: () => void | Promise<void>;
  swapId: string;
}

export const SwapRow: React.FC<RowProps> = ({
  id,
  dir,
  amount,
  status,
  route,
  buttonText: _buttonText,
  swapId,
}) => {
  const maxBtc = useMemo(() => {
    return satsToBtc(amount);
  }, [amount]);
  const date = useMemo(() => {
    const unix = Number(id);
    const d = new Date(unix);
    return format(d, 'yyyy-MM-dd');
  }, [id]);
  const buttonText = useMemo(() => {
    return status === 'success' ? 'Successful' : 'Pending';
  }, [status]);
  const tokens = useMemo(() => {
    if (dir === 'inbound') return ['BTC', 'xBTC'];
    return ['xBTC', 'BTC'];
  }, [dir]);
  return (
    <SwapRowComp cursor="pointer" onClick={route}>
      <Flex flexDirection="row" alignItems="center">
        <Box width="225px">
          <Text variant="Label02">
            {maxBtc} {tokens[0]} -&gt; {tokens[1]}
          </Text>
        </Box>
        <Box width="125px">
          <Text variant="Caption02">{date}</Text>
        </Box>
        <Box width="250px">
          {swapId ? (
            <Stack alignItems="center" isInline spacing="12px">
              <Text variant="Caption02">{truncateMiddle(swapId.replace('0x', ''), 8)}</Text>
              <DuplicateIcon clipboardText={swapId} />
            </Stack>
          ) : null}
        </Box>
        <Box width="150px">
          <StatusButton status={status}>{_buttonText || buttonText}</StatusButton>
        </Box>
      </Flex>
    </SwapRowComp>
  );
};

export const InboundSwapItem: React.FC<{ id: string }> = ({ id }) => {
  const [swap] = useInboundSwapStorage(id);
  const router = useRouter();

  const swapId = useMemo(() => {
    return 'btcTxid' in swap ? swap.btcTxid : '';
  }, [swap]);
  const statusInfo: { status: 'success' | 'pending'; buttonText?: string } = useMemo(() => {
    if ('finalizeTxid' in swap) {
      return { status: 'success' };
    }
    if ('btcTxid' in swap) {
      return { status: 'pending' };
    }
    return { status: 'success', buttonText: 'Started' };
  }, [swap]);
  const goToSwap = useCallback(() => {
    void router.push({
      pathname: '/inbound/[swapId]',
      query: { swapId: swap.id },
    });
  }, [router, swap]);
  return (
    <SwapRow
      id={id}
      amount={swap.inputAmount}
      dir="inbound"
      route={goToSwap}
      swapId={swapId}
      {...statusInfo}
    />
  );
};

export const OutboundSwapItem: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter();
  const [storage] = useQueryAtom(outboundSwapStorageState(id));
  const { txId } = storage;
  const amount = useMemo(() => {
    return storage.amount || '0';
  }, [storage]);
  const swapId = useStxTxResult<bigint | null>(txId);
  const [finalizeTxid] = useFinalizedOutboundSwap(swapId);
  const status = useMemo(() => {
    if (finalizeTxid) return 'success';
    return 'pending';
  }, [finalizeTxid]);
  const goToSwap = useCallback(() => {
    void router.push({
      pathname: '/outbound/[txId]',
      query: { txId },
    });
  }, [router, txId]);
  return (
    <SwapRow
      id={id}
      amount={amount}
      dir="outbound"
      route={goToSwap}
      status={status}
      swapId={txId}
    />
  );
};

export const SwapItem: React.FC<{ item: SwapListItem }> = ({ item }) => {
  if (item.dir === 'inbound') {
    return <InboundSwapItem id={item.id} />;
  }
  return <OutboundSwapItem id={item.id} />;
};

export const LoadingRow: React.FC<{ item: SwapListItem }> = ({ item }) => {
  const tokens = useMemo(() => {
    if (item.dir === 'inbound') return ['BTC', 'xBTC'];
    return ['xBTC', 'BTC'];
  }, [item.dir]);
  const date = useMemo(() => {
    const unix = Number(item.id);
    const d = new Date(unix);
    return format(d, 'yyyy-MM-dd');
  }, [item.id]);
  return (
    <SwapRowComp>
      <Flex flexDirection="row" alignItems="center">
        <Box width="225px">
          <Stack isInline spacing="16px">
            <Spinner />
            <Text variant="Caption02">{tokens.join(' -> ')}</Text>
          </Stack>
        </Box>
        <Box width="125px">
          <Text variant="Caption02">{date}</Text>
        </Box>
      </Flex>
    </SwapRowComp>
  );
};

export const EmptyRow: React.FC = () => {
  return (
    <SwapRowComp>
      <Text variant="Caption02">No swaps found.</Text>
    </SwapRowComp>
  );
};
