package dev.ilionx.workshop.api.visit.model.mapper;

import dev.ilionx.workshop.api.vet.model.Vet;
import dev.ilionx.workshop.api.vet.model.response.VetSummaryResponse;
import dev.ilionx.workshop.api.visit.model.Visit;
import dev.ilionx.workshop.api.visit.model.response.VisitResponse;
import io.github.jframe.util.mapper.config.SharedMapperConfig;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for converting Visit entities to response DTOs.
 */
@Mapper(config = SharedMapperConfig.class)
public abstract class VisitMapper {

    @Mapping(
        source = "pet.id",
        target = "petId"
    )
    @Mapping(
        source = "pet.owner.id",
        target = "ownerId"
    )
    public abstract VisitResponse toResponse(Visit visit);

    public abstract List<VisitResponse> toResponseList(List<Visit> visits);

    public abstract VetSummaryResponse toVetSummaryResponse(Vet vet);
}
