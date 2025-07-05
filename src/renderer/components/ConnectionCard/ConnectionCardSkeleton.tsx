import { Card, Flex, Skeleton } from '../ui'

export function ConnectionCardSkeleton() {
  return (
    <Card style={{ minWidth: '280px', maxWidth: '320px' }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Skeleton width={32} height={32} variant="circular" />
            <Skeleton width={120} height={20} />
          </Flex>
          <Skeleton width={60} height={20} />
        </Flex>

        <Flex direction="column" gap="1" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={16} />
          <Skeleton width="70%" height={16} />
        </Flex>

        <Flex justify="between" align="center">
          <Skeleton width={80} height={14} />
          <Skeleton width={50} height={24} />
        </Flex>
      </Flex>
    </Card>
  )
}
