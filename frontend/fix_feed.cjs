const fs = require('fs');

const filepath = 'd:/team5ProjectDesign/pickxelFinal/frontend/src/app/pages/Feed.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const startMarker = '{/* Feed Detail Modal */}';
const endMarker = '</div>\n  );\n}';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `      <FeedDetailModal
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
    `;
    
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    fs.writeFileSync(filepath, content);
    console.log("Successfully replaced modals in Feed.tsx");
} else {
    console.log("Markers not found!");
}
