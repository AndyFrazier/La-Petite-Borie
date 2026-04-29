import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Home, LogOut, Save, Upload, X, Eye, EyeOff, Trash2, GripVertical } from 'lucide-react';
import type { Database } from '../types/database';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyImage = Database['public']['Tables']['property_images']['Row'];

export function AdminDashboard() {
  const { signOut } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: 0,
    bathrooms: 0,
    area_sqm: 0,
    land_area_sqm: 0,
    year_built: '',
    features: '',
    contact_email: '',
    contact_phone: '',
    is_published: false,
  });

  useEffect(() => {
    loadProperty();
  }, []);

  async function loadProperty() {
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .maybeSingle();

      if (propertyError) throw propertyError;

      if (propertyData) {
        setProperty(propertyData);
        setFormData({
          title: propertyData.title,
          description: propertyData.description,
          price: propertyData.price,
          location: propertyData.location,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          area_sqm: propertyData.area_sqm,
          land_area_sqm: propertyData.land_area_sqm,
          year_built: propertyData.year_built?.toString() || '',
          features: propertyData.features.join('\n'),
          contact_email: propertyData.contact_email,
          contact_phone: propertyData.contact_phone,
          is_published: propertyData.is_published,
        });

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const propertyPayload = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        location: formData.location,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area_sqm: Number(formData.area_sqm),
        land_area_sqm: Number(formData.land_area_sqm),
        year_built: formData.year_built ? Number(formData.year_built) : null,
        features: formData.features.split('\n').filter(f => f.trim()),
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        is_published: formData.is_published,
        updated_at: new Date().toISOString(),
      };

      if (property) {
        const { error } = await supabase
          .from('properties')
          .update(propertyPayload)
          .eq('id', property.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert([propertyPayload])
          .select()
          .single();

        if (error) throw error;
        setProperty(data);
      }

      setMessage('Property saved successfully');
      await loadProperty();
    } catch (error) {
      console.error('Error saving property:', error);
      setMessage('Error saving property');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !property) return;

    setUploading(true);
    setMessage('');

    try {
      const files = Array.from(e.target.files);

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${property.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('property_images')
          .insert([{
            property_id: property.id,
            image_url: publicUrl,
            display_order: images.length,
          }]);

        if (dbError) throw dbError;
      }

      await loadProperty();
      setMessage('Images uploaded successfully');
    } catch (error) {
      console.error('Error uploading images:', error);
      setMessage('Error uploading images');
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  }

  async function handleDeleteImage(imageId: string, imageUrl: string) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const filePath = imageUrl.split('/property-images/')[1];

      await supabase.storage
        .from('property-images')
        .remove([filePath]);

      const { error } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      await loadProperty();
      setMessage('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      setMessage('Error deleting image');
    }
  }

  async function handleReorderImages(newOrder: PropertyImage[]) {
    try {
      for (let i = 0; i < newOrder.length; i++) {
        const { error } = await supabase
          .from('property_images')
          .update({ display_order: i })
          .eq('id', newOrder[i].id);

        if (error) throw error;
      }

      setImages(newOrder);
      setMessage('Images reordered successfully');
    } catch (error) {
      console.error('Error reordering images:', error);
      setMessage('Error reordering images');
    }
  }

  async function handleUpdateCaption(imageId: string, caption: string) {
    try {
      const { error } = await supabase
        .from('property_images')
        .update({ caption })
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.map(img =>
        img.id === imageId ? { ...img, caption } : img
      ));
    } catch (error) {
      console.error('Error updating caption:', error);
      setMessage('Error updating caption');
    }
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];

    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setImages(newImages);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    if (draggedIndex !== null) {
      handleReorderImages(images);
    }
    setDraggedIndex(null);
  }

  async function handleTogglePublish() {
    if (!property) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_published: !formData.is_published })
        .eq('id', property.id);

      if (error) throw error;

      setFormData({ ...formData, is_published: !formData.is_published });
      setMessage(`Property ${!formData.is_published ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error toggling publish:', error);
      setMessage('Error updating publish status');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl font-light text-stone-800">Property Admin</h1>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {message && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-2xl font-light text-stone-800 mb-6">Property Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      placeholder="Beautiful French Farmhouse"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-none"
                      placeholder="Describe your lovely farmhouse..."
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Price (€)
                      </label>
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                        placeholder="415000 or TBA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                        placeholder="Provence, France"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Living Area (m²)
                      </label>
                      <input
                        type="number"
                        value={formData.area_sqm}
                        onChange={(e) => setFormData({ ...formData, area_sqm: Number(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Land Area (m²)
                      </label>
                      <input
                        type="number"
                        value={formData.land_area_sqm}
                        onChange={(e) => setFormData({ ...formData, land_area_sqm: Number(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Year Built
                    </label>
                    <input
                      type="number"
                      value={formData.year_built}
                      onChange={(e) => setFormData({ ...formData, year_built: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      placeholder="1850"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Features (one per line)
                    </label>
                    <textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-none font-mono text-sm"
                      placeholder="Stone fireplace&#10;Original beams&#10;Wine cellar&#10;Swimming pool"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                        placeholder="contact@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-xl font-light text-stone-800 mb-4">Publish Status</h2>
              <button
                onClick={handleTogglePublish}
                disabled={!property}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                  formData.is_published
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                }`}
              >
                {formData.is_published ? (
                  <>
                    <Eye className="w-5 h-5" />
                    Published
                  </>
                ) : (
                  <>
                    <EyeOff className="w-5 h-5" />
                    Unpublished
                  </>
                )}
              </button>
              <p className="text-sm text-stone-600 mt-3 text-center">
                {formData.is_published
                  ? 'Your property is visible to the public'
                  : 'Your property is hidden from the public'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-xl font-light text-stone-800 mb-4">Images</h2>

              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-lg p-8 text-center transition-colors">
                  <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm text-stone-600">
                    {uploading ? 'Uploading...' : 'Click to upload images'}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">JPG, PNG up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={!property || uploading}
                  className="hidden"
                />
              </label>

              {images.length > 0 && (
                <div className="mt-6 space-y-3">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className={`bg-stone-50 rounded-lg p-3 group transition-all ${
                        draggedIndex === index ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <div
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-3 cursor-move mb-2"
                      >
                        <GripVertical className="w-4 h-4 text-stone-400" />
                        <img
                          src={image.image_url}
                          alt={image.caption || `Property ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-600 truncate">Image {index + 1}</p>
                          <p className="text-xs text-stone-400">Order: {index}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteImage(image.id, image.image_url)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded transition-all"
                          aria-label="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={image.caption}
                        onChange={(e) => handleUpdateCaption(image.id, e.target.value)}
                        placeholder="Add a caption..."
                        className="w-full px-3 py-1.5 text-sm rounded border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
