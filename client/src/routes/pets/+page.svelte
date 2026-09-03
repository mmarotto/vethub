<script lang="ts">
	import { getPets } from '$lib/api/pet/PetController';
	import { getOwners } from '$lib/api/owner/OwnerController';
	import type { PetResponse, OwnerResponse } from '$lib/api/models';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { PawPrint, Search, Calendar } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let pets = $state<PetResponse[]>([]);
	let owners = $state<OwnerResponse[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');

	// Map of ownerId -> owner, so we can display/search on owner name
	// even though the flat pet list only carries a bare ownerId.
	let ownersById = $derived(() => {
		const map = new Map<number, OwnerResponse>();
		for (const owner of owners) {
			map.set(owner.id, owner);
		}
		return map;
	});

	function ownerName(pet: PetResponse): string {
		const owner = ownersById().get(pet.ownerId);
		return owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown owner';
	}

	let filteredPets = $derived(() => {
		if (!searchQuery.trim()) return pets;
		const query = searchQuery.toLowerCase();
		return pets.filter(
			(pet) =>
				pet.name?.toLowerCase().includes(query) ||
				ownerName(pet).toLowerCase().includes(query)
		);
	});

	function formatDate(dateStr: string | undefined): string {
		if (!dateStr) return 'Unknown';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function loadPets() {
		loading = true;
		try {
			[pets, owners] = await Promise.all([getPets(), getOwners()]);
		} catch (err) {
			toast.error('Failed to load pets');
			console.error('Error loading pets:', err);
		} finally {
			loading = false;
		}
	}

	// Load pets (and owners, for name lookup) on mount
	$effect(() => {
		loadPets();
	});
</script>

<svelte:head>
	<title>Pets | VetHub</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
				<PawPrint class="h-6 w-6 text-accent" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground">Pets</h1>
				<p class="text-sm text-muted-foreground">Look up any pet across all owners</p>
			</div>
		</div>
	</div>

	<!-- Search -->
	<div class="mb-6">
		<div class="relative max-w-md">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search by pet or owner name..."
				bind:value={searchQuery}
				class="pl-10"
			/>
		</div>
	</div>

	<!-- Table -->
	{#if loading}
		<div class="card p-12 text-center">
			<div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
			<p class="text-muted-foreground">Loading pets...</p>
		</div>
	{:else if filteredPets().length === 0}
		<div class="card p-12 text-center">
			<PawPrint class="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
			{#if searchQuery}
				<p class="text-muted-foreground">No pets found matching "{searchQuery}"</p>
			{:else}
				<p class="text-muted-foreground">No pets registered yet</p>
			{/if}
		</div>
	{:else}
		<div class="card overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Owner</Table.Head>
						<Table.Head>Birth Date</Table.Head>
						<Table.Head class="w-[100px]">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredPets() as pet (pet.id)}
						<Table.Row class="hover:bg-muted/50">
							<Table.Cell>
								<a href="/pets/{pet.id}" class="font-medium text-foreground hover:text-primary">
									{pet.name}
								</a>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary">{pet.type?.name ?? 'Unknown'}</Badge>
							</Table.Cell>
							<Table.Cell>
								<a
									href="/owners/{pet.ownerId}"
									class="text-sm text-muted-foreground hover:text-primary"
								>
									{ownerName(pet)}
								</a>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<Calendar class="h-3.5 w-3.5" />
									{formatDate(pet.birthDate)}
								</div>
							</Table.Cell>
							<Table.Cell>
								<Button variant="ghost" size="sm" href="/pets/{pet.id}">
									View
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<p class="mt-4 text-sm text-muted-foreground">
			Showing {filteredPets().length} of {pets.length} pets
		</p>
	{/if}
</div>
