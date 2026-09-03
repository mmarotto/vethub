package dev.ilionx.workshop.api.vet.model.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.Accessors;

/**
 * Summary response DTO for a vet embedded within another response (e.g. a visit).
 */
@Getter
@Setter
@NoArgsConstructor
@Accessors(chain = true)
@Schema(description = "Summary of a vet within another response")
public class VetSummaryResponse {

    @Schema(
        description = "The unique identifier of the vet",
        example = "1",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private Integer id;

    @Schema(
        description = "The vet's first name",
        example = "James",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String firstName;

    @Schema(
        description = "The vet's last name",
        example = "Carter",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String lastName;
}
