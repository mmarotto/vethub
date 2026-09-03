<script lang="ts">
	import { getVisits } from '$lib/api/visit/VisitController';
	import { getPets } from '$lib/api/pet/PetController';
	import { getOwners } from '$lib/api/owner/OwnerController';
	import type { VisitResponse, PetResponse, OwnerResponse } from '$lib/api/models';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { Calendar, Search, Loader2, ExternalLink } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let visits = $state<VisitResponse[]>([]);
	let pets = $state<PetResponse[]>([]);
	let owners = $state<OwnerResponse[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');

	// Maps of id -> entity, so we can display/search on pet and owner name
	// even though VisitResponse only carries petId/ownerId.
	let petsById = $derived(() => {
		const map = new Map<number, PetResponse>();
		for (const pet of pets) {
			map.set(pet.id, pet);
		}
		return map;
	});

	let ownersById = $derived(() => {
		const map = new Map<number, OwnerResponse>();
		for (const owner of owners) {
			map.set(owner.id, owner);
		}
		return map;
	});

	function petName(visit: VisitResponse): string {
		return petsById().get(visit.petId)?.name ?? `Pet #${visit.petId}`;
	}

	function ownerName(visit: VisitResponse): string {
		const owner = ownersById().get(visit.ownerId);
		return owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown owner';
	}

	const filteredVisits = $derived(() => {
		if (!searchQuery.trim()) return visits;
		const query = searchQuery.toLowerCase();
		return visits.filter(
			(visit) =>
				visit.description.toLowerCase().includes(query) ||
				petName(visit).toLowerCase().includes(query) ||
				ownerName(visit).toLowerCase().includes(query)
		);
	});

	async function loadVisits() {
		loading = true;
		try {
			[visits, pets, owners] = await Promise.all([getVisits(), getPets(), getOwners()]);
		} catch (e) {
			toast.error('Failed to load visits');
			console.error('Error loading visits:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadVisits();
	});
</script>

<svelte:head>
	<title>Visits | VetHub</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
				<Calendar class="h-5 w-5 text-primary" />
			</div>
			<h1 class="text-3xl font-bold text-foreground">Visits</h1>
		</div>
		<p class="text-muted-foreground">View all veterinary visits across all pets</p>
	</div>

	<!-- Search -->
	<div class="mb-6">
		<div class="relative max-w-md">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search by pet, owner, or description..."
				class="pl-10"
				bind:value={searchQuery}
			/>
		</div>
	</div>

	<!-- Content -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{:else if visits.length === 0}
		<div class="rounded-lg border border-dashed p-12 text-center">
			<Calendar class="mx-auto h-12 w-12 text-muted-foreground/50" />
			<h3 class="mt-4 text-lg font-medium text-foreground">No visits yet</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				Visits will appear here once they are recorded for pets.
			</p>
		</div>
	{:else}
		<div class="rounded-lg border bg-card">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Date</Table.Head>
						<Table.Head>Pet</Table.Head>
						<Table.Head>Owner</Table.Head>
						<Table.Head>Vet</Table.Head>
						<Table.Head>Diagnosis</Table.Head>
						<Table.Head>Treatment</Table.Head>
						<Table.Head class="w-[100px]">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredVisits() as visit (visit.id)}
						<Table.Row>
							<Table.Cell class="font-medium">
								{new Date(visit.date).toLocaleDateString()}
							</Table.Cell>
							<Table.Cell>{petName(visit)}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{ownerName(visit)}</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								{#if visit.vet}
									{visit.vet.firstName} {visit.vet.lastName}
								{:else}
									&mdash;
								{/if}
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">{visit.diagnosis ?? '—'}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{visit.treatment ?? '—'}</Table.Cell>
							<Table.Cell>
								<Button
									variant="ghost"
									size="sm"
									href="/owners/{visit.ownerId}/pets/{visit.petId}"
									title="View pet details"
								>
									<ExternalLink class="h-4 w-4" />
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={7} class="text-center text-muted-foreground py-8">
								No visits match your search
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<p class="mt-4 text-sm text-muted-foreground">
			Showing {filteredVisits().length} of {visits.length} visits
		</p>
	{/if}
</div>
