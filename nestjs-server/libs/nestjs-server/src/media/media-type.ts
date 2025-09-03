
export enum MediaType {
    Audio = 'Audio',
    Image = 'Image',
    Video = 'Video',
}

interface MediaSuffixMapping {
    suffix: string;
    mediaType: MediaType;
}

export const SUPPORTED_MEDIA_TYPES = [
    { suffix: 'mp3', mediaType: MediaType.Audio},
    { suffix: 'jpg', mediaType: MediaType.Image},
    { suffix: 'jpeg', mediaType: MediaType.Image},
    { suffix: 'png', mediaType: MediaType.Image},
    { suffix: 'gif', mediaType: MediaType.Image},
    { suffix: 'mp4', mediaType: MediaType.Video},
]

export const MEDIA_TYPE_MAP = new Map<string, MediaType>();
SUPPORTED_MEDIA_TYPES.forEach(mapping => {
    MEDIA_TYPE_MAP.set(mapping.suffix, mapping.mediaType);
});

