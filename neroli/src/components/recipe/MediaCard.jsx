import Card from "./Card";

// Show attached recipe photos and playable videos.
const MediaCard = ({ media }) => (
  <Card title="Media">
    <div className="mt-4 grid grid-cols-2 gap-3">
      {media.map((item) =>
        item.type === "video" ? (
          <video
            className="col-span-2 aspect-video w-full rounded-[20px] bg-black object-contain"
            src={item.url}
            controls
            playsInline
            preload="auto"
            key={item.url}
          />
        ) : (
          <img
            className="aspect-square w-full rounded-[20px] object-cover"
            src={item.url}
            alt=""
            key={item.url}
          />
        ),
      )}
    </div>
  </Card>
);

export default MediaCard;
