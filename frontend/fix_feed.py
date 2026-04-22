import os

filepath = 'd:/team5ProjectDesign/pickxelFinal/frontend/src/app/pages/Feed.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '{/* Feed Detail Modal */}'
end_marker = '</div>\n  );\n}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    replacement = """      <FeedDetailModal
        isOpen={!!selectedFeed}
        onClose={() => setSelectedFeed(null)}
        feed={selectedFeed ? { ...selectedFeed, id: selectedFeed.id, title: selectedFeed.title, description: selectedFeed.description, imageUrl: selectedFeed.image, author: { name: selectedFeed.author.name, avatar: selectedFeed.author.avatar, role: selectedFeed.author.role }, likes: selectedFeed.likes, comments: selectedFeed.comments } : null}
        onCollectionUpdate={loadCollectionFolders}
      />

      <CollectionSaveModal
        isOpen={!!collectionModalFeed}
        onClose={() => setCollectionModalFeed(null)}
        postId={collectionModalFeed?.id ?? 0}
        postTitle={collectionModalFeed?.title ?? ''}
        onSaveSuccess={loadCollectionFolders}
      />
    """
    
    new_content = content[:start_idx] + replacement + content[end_idx:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced modals in Feed.tsx")
else:
    print("Markers not found!")
