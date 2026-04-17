'use client';

import { useState, useEffect } from 'react';
import { petService } from '@/services/pet.service';
import type { Pet } from '@/types';

export function usePets(userId: string | undefined) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    petService
      .getPetsByUser(userId)
      .then(setPets)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { pets, loading, error };
}
