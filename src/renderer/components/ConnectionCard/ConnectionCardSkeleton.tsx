import { Card, Flex, Skeleton } from '../ui'

export function ConnectionCardSkeleton() {
  return (
    <Card style={{ width: '240px', padding: '12px' }}>
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Skeleton width={24} height={24} variant="circular" />
            <Skeleton width={100} height={16} />
          </Flex>
          <Skeleton width={24} height={24} />
        </Flex>

        <Skeleton width="90%" height={14} />

        <Flex justify="between" align="center">
          <Skeleton width={60} height={14} />
          <Skeleton width={50} height={14} />
        </Flex>
      </Flex>
    </Card>
  )
}
