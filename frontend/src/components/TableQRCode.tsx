export function TableQRCode({ tableId }: { tableId: string }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(15, 23, 42, 0.9)',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      color: '#e2e8f0',
      fontSize: '0.85rem',
      zIndex: 1000,
    }}>
      <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
        📱 Scan to Browse Menu
      </div>
      <div style={{ 
        width: '150px', 
        height: '150px', 
        background: 'white', 
        padding: '0.5rem',
        borderRadius: '0.25rem',
        marginBottom: '0.5rem'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          color: '#1f2937',
          border: '2px dashed #94a3b8',
          borderRadius: '0.25rem'
        }}>
          QR Code: {tableId}
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
        Table {tableId}
      </div>
    </div>
  );
}
