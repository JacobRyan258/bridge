import React, { useMemo } from 'react';
import { Text } from '../text';
import { Box, Flex } from '@nelson-ui/react';
import { Operator, useOperators } from '../../common/store';
import { styled } from '@stitches/react';
import { SupplierRow } from './supplier-row';
import { amountState, useSwapForm } from '../../common/hooks/use-swap-form';
import { useAtomValue } from 'jotai/utils';

export const SelectSupplier: React.FC = () => {
  const { outputToken } = useSwapForm();

  const [operators] = useOperators();

  const rows = useMemo(() => {
    return operators.map(operator => {
      return <SupplierRow operator={operator} key={operator.id} outputToken={outputToken} />;
    });
  }, [operators, outputToken]);

  const token = useMemo(() => {
    return outputToken === 'xbtc' ? 'xBTC' : 'BTC';
  }, [outputToken]);

  return (
    <Flex>
      <Box width="800px">
        <Flex flexDirection="row" px="28px" py="15px" width="100%">
          <Box width="225px" flexGrow={1}>
            <Text color="$color-slate-85" variant="Caption02">
              Selected Supplier
            </Text>
          </Box>
          <Box width="150px">
            <Text color="$color-slate-85" variant="Caption02">
              {token} Capacity
            </Text>
          </Box>
          <Box width="150px">
            <Text color="$color-slate-85" variant="Caption02">
              -&gt; {token} fee
            </Text>
          </Box>
          <Box width="150px">
            <Text color="$color-slate-85" variant="Caption02">
              Base fee
            </Text>
          </Box>
        </Flex>
        <Flex width="100%" flexDirection="column">
          {rows}
        </Flex>
      </Box>
    </Flex>
  );
};
