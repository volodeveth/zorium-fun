import request from 'supertest'
import app from '../src/app'

describe('Health Check', () => {
  it('should return 200 for health endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)
    
    expect(response.body).toHaveProperty('status', 'OK')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('uptime')
    expect(response.body).toHaveProperty('environment')
  })
  
  it('should return 404 for non-existent endpoint', async () => {
    const response = await request(app)
      .get('/non-existent-endpoint')
      .expect(404)
    
    expect(response.body).toHaveProperty('error', 'Not Found')
    expect(response.body).toHaveProperty('message')
  })
})