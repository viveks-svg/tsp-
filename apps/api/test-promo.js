fetch('http://127.0.0.1:3001/promo/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Vastu Masterclass',
    description: 'Join our upcoming Vastu Masterclass and learn how to optimize your workspace for prosperity and flow.',
    actionText: 'Register Now',
    actionUrl: '/solutions/business-vastu',
    imageUrl: 'https://images.unsplash.com/photo-1598462002773-19597c55c707'
  })
}).then(res => res.json()).then(console.log).catch(console.error);
