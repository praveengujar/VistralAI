'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Camera, Loader2, Save } from 'lucide-react';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string;
  locale: string;
}

const timezones = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
];

const locales = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'de-DE', label: 'German (Germany)' },
  { value: 'ja-JP', label: 'Japanese (Japan)' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
];

export default function ProfileSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: session?.user?.email || '',
      phone: '',
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
    },
  });

  // Load user profile data
  useEffect(() => {
    if (session?.user) {
      const nameParts = session.user.name?.split(' ') || ['', ''];
      reset({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: session.user.email || '',
        phone: '',
        timezone: 'America/Los_Angeles',
        locale: 'en-US',
      });
    }
  }, [session, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update session with new data
      await updateSession();

      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // TODO: Upload avatar to server
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Profile Settings Section */}
      <div
        className="p-6 rounded-xl"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          border: '1px solid rgb(var(--border))',
        }}
      >
        <div className="mb-6">
          <h2
            className="text-lg font-semibold"
            style={{ color: 'rgb(var(--foreground))' }}
          >
            Profile Settings
          </h2>
          <p
            className="text-sm"
            style={{ color: 'rgb(var(--foreground-muted))' }}
          >
            Update your personal information
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
              {avatarPreview || session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview || session?.user?.image || ''}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold" style={{ color: 'rgb(var(--foreground-muted))' }}>
                  {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1.5 bg-primary-600 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <h3 className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>Profile Photo</h3>
            <p className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName', { required: 'First name is required' })}
              className="input"
              placeholder="John"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm" style={{ color: 'rgb(var(--error))' }}>{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName', { required: 'Last name is required' })}
              className="input"
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm" style={{ color: 'rgb(var(--error))' }}>{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            disabled
            className="input cursor-not-allowed opacity-60"
          />
          <p className="mt-1 text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>
            Contact support to change your email address
          </p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className="input"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {/* Timezone & Locale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
              Timezone
            </label>
            <select
              id="timezone"
              {...register('timezone')}
              className="input"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="locale" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
              Language
            </label>
            <select
              id="locale"
              {...register('locale')}
              className="input"
            >
              {locales.map((locale) => (
                <option key={locale.value} value={locale.value}>
                  {locale.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div
          className="flex justify-end pt-4"
          style={{ borderTop: '1px solid rgb(var(--border))' }}
        >
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'rgb(var(--primary))',
              color: 'rgb(var(--primary-foreground))',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
