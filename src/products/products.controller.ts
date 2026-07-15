import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ProductService } from "./products.service";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Roles } from "src/user/role/role.decorator";
import { Role } from "src/user/role/role.enum";
import { Public } from "src/user/guard/public.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateApprovalProductDto } from "./dto/approve-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateVariantDto } from "./dto/update-variant.dto";

@Controller("products")
export class ProductController {
  constructor(private readonly ProductService: ProductService) { }
 

  @Post("create")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  createProduct(@Body() productData: CreateProductDto) {
    return this.ProductService.createProduct(productData);
  }

  @Get("vendor/:vendorId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  getAllVerifiedProducts(
    @Param("vendorId") vendorId: string,
    @Query("search") searchTerm: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query("approved") approved: string | boolean,
    @Query("status") status: string,
    @Query("categoryIds") categoryIds: string
  ) {
    page = Number(page);
    limit = Number(limit);
    approved =
      approved !== undefined
        ? approved === "true"
          ? true
          : approved === "false"
            ? false
            : undefined
        : undefined;
    const categoryArray = categoryIds ? categoryIds.split(',') : [];
    return this.ProductService.getAllVerifiedProducts(
      vendorId,
      searchTerm,
      approved,
      page,
      limit,
      status,
      categoryArray
    );
  }

  @Get(':adminId/assigned-vendors-products')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAssignedVendorsProducts(
    @Param('adminId') adminId: string,
    @Query("approved") approved: string | boolean,
    @Query('page') page: number | string = "1",
    @Query('limit') limit: number | string = "10",
    @Query("search") searchTerm: string,
    @Query("status") status: string
  ) {
    page = Number(page);
    limit = Number(limit);
    approved =
      approved !== undefined
        ? approved === "true"
          ? true
          : approved === "false"
            ? false
            : undefined
        : undefined;
    return this.ProductService.getAssignedVendorsProducts(adminId, approved, page, limit, searchTerm, status);
  }

  @Put(":id/user/:userId/update")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  updateProduct(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() updatedProductData: UpdateProductDto
  ) {
    return this.ProductService.updateProduct(id, userId, updatedProductData);
  }

  @Put(":id/categories")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  updateProductCategories(
    @Param("id") id: string,
    @Body("categoryId") categoryId: string[]
  ) {
    return this.ProductService.updateProductCategories(id, categoryId);
  }

  @Put("verify/:productId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  approveProducts(
    @Param("productId") productId: string,
    @Body() verfiedData: UpdateApprovalProductDto
  ) {
    return this.ProductService.approveProducts(productId, verfiedData);
  }

  @Public()
  @Get("feature")
  getFeaturedProduct(
    @Query("search") searchTerm: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10"
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.ProductService.getFeaturedProduct(searchTerm, page, limit);
  }

  @Public()
  @Get("discount")
  getDiscountedProducts(
    @Query("search") searchTerm: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10"
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.ProductService.getDiscountedProducts(searchTerm, page, limit);
  }

  @Get("lightProducts")
  findAllLight(
    @Req() req: any,
    @Query("search") searchTerm: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query("officeId") officeId?: string,
    @Query("onlyInventory") onlyInventory?: string,
    @Query("inventoryType") inventoryType?: "CONSUMABLE" | "EQUIPMENT"
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.ProductService.findAllLight(
      searchTerm,
      page,
      limit,
      officeId,
      onlyInventory === 'true',
      inventoryType,
      req.user
    );
  }

  @Get()
  getAllProducts(
    @Query("search") searchTerm: string,
    @Query("category") categories: string = "",
    @Query("minPrice") minPrice: string,
    @Query("maxPrice") maxPrice: string,
    @Query("vendorFirstName") vendorFirstName: string = "",
    @Query("vendorLastName") vendorLastName: string = "",
    @Query("minRating") minRating: string,
    @Query("discount") discount: boolean,
    @Query("featured") featured: boolean,
    @Query("brand") brands: string,
    @Query("material") material: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query("recent") recent: boolean = false,
    // @Query("subCategory") subCategories: string,    
    @Query("rating") rating: string,
    @Query("sortBy") sortBy: "lowPrice" | "highRated" | "percentSaving" | "bestSeller",
    @Query("approved") approved: boolean,
    @Query("status") status: string,
    @Query("isActive") isActive: boolean,
    @Query("attributes") attributes: string,
    @Query("inventoryType") inventoryType?: "CONSUMABLE" | "EQUIPMENT"
  ) {
    const categoryArray = categories ? categories.split(',') : [];
    const brandArray = brands ? brands.split(',') : [];
    // const subCategoryArray = subCategories ? subCategories.split(',') : [];

    page = Number(page);
    limit = Number(limit);
    const minPriceNumber = parseFloat(minPrice);
    const maxPriceNumber = parseFloat(maxPrice);
    const minRatingNumber = parseFloat(minRating);

    return this.ProductService.findAllProducts(
      searchTerm,
      page,
      limit,
      categoryArray,
      minPriceNumber,
      maxPriceNumber,
      vendorFirstName,
      vendorLastName,
      minRatingNumber,
      discount,
      featured,
      brandArray,
      material,
      recent,
      // subCategoryArray,
      rating,
      sortBy,
      approved,
      status,
      isActive,
      attributes,
      inventoryType
    );
  }

  @Delete(":id/delete")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  deleteProduct(
    @Param("id") id: string | string[],
    @Req() req
  ) {
    return this.ProductService.deleteProduct(id, req.user);
  }

 
  @Get("variant-attributes")
  getVariantAttributes() {
    return this.ProductService.getVariantAttributes();
  }

  @Public()
  @Get(":slug")
  getSpecificProduct(@Param("slug") slug: string) {
    return this.ProductService.getSpecificProduct(slug);
  }

  @Get(":id/variant/:variantId")
  getSpecificVariant(
    @Param("id") productId: string,
    @Param("variantId") variantId: string
  ) {
    return this.ProductService.getSpecificVariant(productId, variantId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Put(":id/variant/:variantId/update")
  updateVariant(
    @Param("id") productId: string,
    @Param("variantId") variantId: string,
    @Body() updateVariantData: UpdateVariantDto
  ) {
    return this.ProductService.updateVariant(
      productId,
      variantId,
      updateVariantData
    );
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Delete(":id/variant/:variantId/update")
  deleteVariant(
    @Param("id") productId: string,
    @Param("variantId") variantId: string
  ) {
    return this.ProductService.deleteVariant(productId, variantId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Get("vendor/:vendorId/mostSellingProduct")
  getBestSellingProducts(
    @Param("vendorId") vendorId: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10"
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.ProductService.getBestSellingProducts(vendorId, page, limit);
  }

  @Get("bestSelling/website")
  getBestSellingProductsForWebsite(
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.ProductService.getBestSellingProductsForWebsite(page, limit);
  }

  @Public()
  @Get(":slug/related")
  findRelatedProducts(
    @Param("slug") slug: string,
    @Query("limit") limit: string | number = "10"
  ) {
    limit = Number(limit);
    return this.ProductService.findRelatedProducts(slug, limit);
  }

  @Get("user/:userId/recommended")
  getMayYouLikeProducts(
    @Param("userId") userId: string
  ) {
    return this.ProductService.getMayYouLikeProducts(userId);
  }
}
