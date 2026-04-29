import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Home, Bed, Bath, Maximize, Calendar, Mail, Phone, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Database } from '../types/database';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyImage = Database['public']['Tables']['property_images']['Row'];

export function PropertyListing() {
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    loadProperty();
  }, []);

  useEffect(() => {
    if (property && images.length > 0) {
      const description = property.description.length > 155
        ? property.description.substring(0, 155) + '...'
        : property.description;

      document.title = property.title;

      updateMetaTag('name', 'description', description);
      updateMetaTag('property', 'og:title', property.title);
      updateMetaTag('property', 'og:description', description);
      updateMetaTag('property', 'og:image', images[0].image_url);
      updateMetaTag('name', 'twitter:title', property.title);
      updateMetaTag('name', 'twitter:description', description);
      updateMetaTag('name', 'twitter:image', images[0].image_url);
    }
  }, [property, images]);

  function updateMetaTag(attr: string, attrValue: string, content: string) {
    let element = document.querySelector(`meta[${attr}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  async function loadProperty() {
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .maybeSingle();

      if (propertyError) throw propertyError;

      if (propertyData) {
        setProperty(propertyData);

        const { data: imagesData, error: imagesError } = await supabase
          .from('property_images')
          .select('*')
          .eq('property_id', propertyData.id)
          .order('display_order');

        if (imagesError) throw imagesError;
        setImages(imagesData || []);
      }
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevLightboxImage = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;

      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Home className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-2xl font-light text-stone-800 mb-2">No Property Listed</h2>
          <p className="text-stone-600">This property is not currently available for viewing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {images.length > 0 && (
        <div className="relative h-[80vh] bg-stone-900">
          <img
            src={images[currentImageIndex].image_url}
            alt={images[currentImageIndex].caption || property.title}
            className="w-full h-full object-cover cursor-pointer"
            onDoubleClick={() => openLightbox(currentImageIndex)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-stone-800" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-stone-800" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-5xl font-light mb-2">{property.title}</h1>
            <p className="text-xl flex items-center gap-2 text-white/90">
              <MapPin className="w-5 h-5" />
              {property.location}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-3xl font-light text-stone-800 mb-6">About This Property</h2>
              <div className="prose prose-stone max-w-none text-stone-600 whitespace-pre-line leading-relaxed">
                {(() => {
                  const paragraphs = property.description.split('\n\n').filter(p => p.trim());
                  const hasMoreParagraphs = paragraphs.length > 2;
                  const displayText = showFullDescription
                    ? property.description
                    : paragraphs.slice(0, 2).join('\n\n');

                  return (
                    <>
                      {displayText}
                      {hasMoreParagraphs && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="block mt-4 text-amber-600 hover:text-amber-700 font-medium transition-colors"
                        >
                          {showFullDescription ? 'See less' : 'See more'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {property.features && property.features.length > 0 && (
              <div>
                <h2 className="text-3xl font-light text-stone-800 mb-6">Features</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {property.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-stone-600">
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length > 1 && (
              <div>
                <h2 className="text-3xl font-light text-stone-800 mb-6">Gallery (double-click to enlarge)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
                      onClick={() => setCurrentImageIndex(index)}
                      onDoubleClick={() => openLightbox(index)}
                    >
                      <img
                        src={image.image_url}
                        alt={image.caption || `Property image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
              <div className="text-4xl font-light text-stone-800 mb-6">
                {isNaN(Number(property.price))
                  ? `€${property.price}`
                  : `€${Number(property.price).toLocaleString('fr-FR')}`
                }
              </div>

              <div className="space-y-4 text-stone-600">
                <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
                  <Bed className="w-5 h-5 text-amber-600" />
                  <span>{property.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
                  <Bath className="w-5 h-5 text-amber-600" />
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
                  <Home className="w-5 h-5 text-amber-600" />
                  <span>{property.area_sqm} m² Living Space</span>
                </div>
                {property.land_area_sqm > 0 && (
                  <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
                    <Maximize className="w-5 h-5 text-amber-600" />
                    <span>{property.land_area_sqm.toLocaleString('fr-FR')} m² Land</span>
                  </div>
                )}
                {property.year_built && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <span>Built in {property.year_built}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8">
              <h3 className="text-xl font-light text-stone-800 mb-4">Contact</h3>
              <div className="space-y-3 text-stone-600">
                {property.contact_email && (
                  <a
                    href={`mailto:${property.contact_email}`}
                    className="flex items-center gap-3 hover:text-amber-700 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-amber-600" />
                    <span className="break-all">{property.contact_email}</span>
                  </a>
                )}
                {property.contact_phone && (
                  <a
                    href={`tel:${property.contact_phone}`}
                    className="flex items-center gap-3 hover:text-amber-700 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-amber-600" />
                    <span>{property.contact_phone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevLightboxImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-4 rounded-full transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextLightboxImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-4 rounded-full transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          <div
            className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].image_url}
              alt={images[lightboxIndex].caption || `Property image ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === lightboxIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {images[lightboxIndex].caption && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-3 rounded-full">
              <p className="text-white text-sm">{images[lightboxIndex].caption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
