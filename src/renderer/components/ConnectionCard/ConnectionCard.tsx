import { Card, Flex, Text, Button, Box } from '../ui'
import { useState } from 'react'
import './ConnectionCard.css'

interface ConnectionCardProps {
  connection: {
    id: string
    name: string
    type: string
    host: string
    port: number
    database: string
    username: string
    lastUsed?: string
    createdAt: string
  }
  onSelect: (connection: any) => void
  onDelete: (connectionId: string) => void
}

export function ConnectionCard({ connection, onSelect, onDelete }: ConnectionCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: '50%', y: '50%' })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x: `${x}%`, y: `${y}%` })
  }

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getDatabaseIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clickhouse':
        return '🔍'
      case 'postgresql':
        return '🐘'
      case 'mysql':
        return '🐬'
      case 'sqlite':
        return '💾'
      default:
        return '🗄️'
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)

    // Add a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300))
    onDelete(connection.id)
  }

  return (
    <Card
      className={`connection-card ${isHovered ? 'hovered' : ''} ${isDeleting ? 'deleting' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={() => !isDeleting && onSelect(connection)}
      style={
        {
          '--mouse-x': mousePosition.x,
          '--mouse-y': mousePosition.y
        } as React.CSSProperties
      }
    >
      <Box className="card-glow" />

      <Flex direction="column" gap="3" className="card-content">
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Text size="4" className="database-icon">
              {getDatabaseIcon(connection.type)}
            </Text>
            <Text size="3" weight="medium" className="connection-name">
              {connection.name}
            </Text>
          </Flex>
          <Box className="database-type-badge">
            <Text size="1">{connection.type}</Text>
          </Box>
        </Flex>

        <Flex direction="column" gap="1" className="connection-details">
          <Flex align="center" gap="1">
            <Box className="detail-icon">📍</Box>
            <Text size="2" color="gray">
              {connection.host}:{connection.port}
            </Text>
          </Flex>
          <Flex align="center" gap="1">
            <Box className="detail-icon">💾</Box>
            <Text size="2" color="gray">
              {connection.database}
            </Text>
          </Flex>
          <Flex align="center" gap="1">
            <Box className="detail-icon">👤</Box>
            <Text size="2" color="gray">
              {connection.username}
            </Text>
          </Flex>
        </Flex>

        <Flex justify="between" align="center" className="card-footer">
          <Text size="1" color="gray" className="last-used">
            <Box as="span" className="clock-icon">
              🕐
            </Box>
            {formatLastUsed(connection.lastUsed || connection.createdAt)}
          </Text>
          <Button
            size="1"
            variant="soft"
            color="red"
            className="delete-button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '...' : 'Delete'}
          </Button>
        </Flex>
      </Flex>
    </Card>
  )
}
