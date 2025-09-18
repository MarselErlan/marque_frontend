# Railway Deployment Guide

## Quick Deploy to Railway

### Option 1: One-Click Deploy (Recommended)

1. **Visit Railway**: Go to [railway.app](https://railway.app)
2. **New Project**: Click "New Project"
3. **GitHub**: Select "Deploy from GitHub repo"
4. **Repository**: Choose your repository
5. **Auto-Deploy**: Railway will detect Next.js and deploy automatically

### Option 2: CLI Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

## Required Environment Variables

Set these in Railway Dashboard > Variables:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://marquebackend-production.up.railway.app/api/v1
NEXT_PUBLIC_APP_URL=https://marque.website
```

## Post-Deploy Checklist

- [ ] Set environment variables
- [ ] Test authentication flow
- [ ] Verify API connectivity
- [ ] Check mobile responsiveness
- [ ] Test cart functionality

## Domain Configuration

1. **Custom Domain** (Optional):

   - Go to Railway dashboard
   - Click on your service
   - Go to "Domains" tab
   - Add your custom domain

2. **SSL Certificate**:
   - Railway provides automatic SSL
   - Your app will be available at `https://`

## Performance Monitoring

Railway provides built-in monitoring:

- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: Deployment history and rollbacks

## Troubleshooting

### Build Fails

- Check Node.js version (requires 18+)
- Verify all dependencies are in package.json
- Check build logs in Railway dashboard

### Runtime Errors

- Check environment variables
- Verify API endpoint connectivity
- Review application logs

### Slow Performance

- Enable gzip compression (already configured)
- Check image optimization settings
- Monitor memory usage

## Scaling

Railway automatically handles:

- **Auto-scaling**: Based on traffic
- **Load balancing**: Across multiple instances
- **CDN**: Global content delivery

## Cost Optimization

- **Sleep mode**: Apps sleep after inactivity (free plan)
- **Resource limits**: Set CPU/memory limits
- **Usage monitoring**: Track monthly usage

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Discord**: Railway community
- **GitHub Issues**: For app-specific issues
