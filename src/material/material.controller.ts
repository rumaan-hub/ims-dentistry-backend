import {
    Controller,
    Post,
    Param,
    Body,
    Put,
    Get,
    Delete,
    UseGuards,
  } from "@nestjs/common";
  import { JwtGuard } from "src/user/guard/jwt.guard";
  import { RolesGuard } from "src/user/role/role.guard";
  import { CreateMaterialDto } from "./dto/create-material.dto";
  import { MaterialService } from "./material.service";
  import { UpdateMaterialDto } from "./dto/update-material.dto";
  
  @Controller("material")
  export class MaterialController {
    constructor(private readonly materialService: MaterialService) {}
  
    @UseGuards(JwtGuard, RolesGuard)
    @Post("create")
    createMaterial(@Body() materialData: CreateMaterialDto) {
      return this.materialService.createMaterial(materialData);
    }
  
    @Get(":id")
    findMaterialById(@Param("id") id: string) {
      return this.materialService.findMaterialById(id);
    }

    @Get("")
    getAllMaterials() {
      return this.materialService.getAllMaterials();
    }
  
    @UseGuards(JwtGuard, RolesGuard)
    @Put(":materialId/update")
    updateMaterial(
      @Param("materialId") materialId: string,
      @Body() updatedData: UpdateMaterialDto
    ) {
      return this.materialService.updateMaterial(materialId, updatedData);
    }
  
    @UseGuards(JwtGuard, RolesGuard)
    @Delete(":materialId/delete")
    deleteMaterial(@Param("materialId") materialId: string) {
      return this.materialService.deleteMaterial(materialId);
    }
  }
  