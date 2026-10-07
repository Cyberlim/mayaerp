import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FeeCategory } from '@/models/FeeCategory';
import { getCache, setCache, delCache, DEFAULT_CACHE_TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'fee:categories';

const DEFAULT_CATEGORIES = [
  { name: 'Tuition Fee', code: 'tuition', type: 'Academic', defaultAmount: 45000, frequency: 'Semester-wise', isMandatory: true, description: 'Core academic and lecture fee' },
  { name: 'Exam Fee', code: 'exam', type: 'Academic', defaultAmount: 2500, frequency: 'Semester-wise', isMandatory: true, description: 'Semester end assessment and examination fee' },
  { name: 'Books & Course Material', code: 'book', type: 'Kit/Uniform', defaultAmount: 3500, frequency: 'Yearly', isMandatory: false, description: 'Prescribed syllabus textbooks & study kits' },
  { name: 'College Blazer', code: 'blazer', type: 'Kit/Uniform', defaultAmount: 2800, frequency: 'One-Time', isMandatory: false, description: 'Official institution blazer with emblem' },
  { name: 'College Uniform (Pair)', code: 'uniform', type: 'Kit/Uniform', defaultAmount: 2200, frequency: 'One-Time', isMandatory: true, description: 'Official daily college uniform set' },
  { name: 'College T-Shirt', code: 'tshirt', type: 'Kit/Uniform', defaultAmount: 650, frequency: 'One-Time', isMandatory: false, description: 'Departmental and sports event t-shirt' },
  { name: 'College Bag / Backpack', code: 'bag', type: 'Kit/Uniform', defaultAmount: 850, frequency: 'One-Time', isMandatory: false, description: 'Heavy-duty branded college backpack' },
  { name: 'Lab Coat & Apron', code: 'labcoat', type: 'Facility/Lab', defaultAmount: 750, frequency: 'One-Time', isMandatory: false, description: 'Protective lab coat for chemistry/physics/pharmacy labs' },
  { name: 'Lab Facility & Consumables', code: 'lab_fee', type: 'Facility/Lab', defaultAmount: 4000, frequency: 'Semester-wise', isMandatory: false, description: 'Laboratory equipment, computers & consumable charges' },
  { name: 'Disciplinary / Library Fine', code: 'fine', type: 'Fine/Penalty', defaultAmount: 500, frequency: 'As Applicable', isMandatory: false, description: 'Penalties for overdue books, attendance or disciplinary actions' },
  { name: 'Late Fee / Surcharge', code: 'late_fee', type: 'Fine/Penalty', defaultAmount: 1000, frequency: 'As Applicable', isMandatory: false, description: 'Late fee penalty on overdue installment dates' },
  { name: 'Transport / Bus Fee', code: 'transport', type: 'Facility/Lab', defaultAmount: 12000, frequency: 'Yearly', isMandatory: false, description: 'Campus bus route commutation fee' },
  { name: 'Miscellaneous / Other', code: 'other', type: 'Other', defaultAmount: 1000, frequency: 'As Applicable', isMandatory: false, description: 'Miscellaneous university activities and events' },
];

export async function GET() {
  try {
    // 1. Try Redis cache (30 min TTL)
    const cachedCategories = await getCache(CACHE_KEY);
    if (cachedCategories) {
      return NextResponse.json(cachedCategories);
    }

    await connectDB();
    let categories = await FeeCategory.find({}).sort({ createdAt: 1 });

    // Seed defaults if empty
    if (!categories || categories.length === 0) {
      await FeeCategory.insertMany(DEFAULT_CATEGORIES);
      categories = await FeeCategory.find({}).sort({ createdAt: 1 });
    }

    // 2. Cache categories in Redis for 30 minutes
    await setCache(CACHE_KEY, categories, DEFAULT_CACHE_TTL);

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error in GET /api/finance/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch fee categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, code, type, defaultAmount, frequency, isMandatory, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const generatedCode = (code || name).toLowerCase().replace(/[^a-z0-9]/g, '_');

    const existing = await FeeCategory.findOne({ code: generatedCode });
    if (existing) {
      return NextResponse.json({ error: `Category code '${generatedCode}' already exists` }, { status: 400 });
    }

    const newCategory = await FeeCategory.create({
      name: name.trim(),
      code: generatedCode,
      type: type || 'Kit/Uniform',
      defaultAmount: Number(defaultAmount) || 0,
      frequency: frequency || 'One-Time',
      isMandatory: Boolean(isMandatory),
      description: description?.trim() || '',
      status: 'Active',
    });

    // Invalidate categories cache
    await delCache(CACHE_KEY);

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/finance/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to create fee category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, name, type, defaultAmount, frequency, isMandatory, description, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const updated = await FeeCategory.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(defaultAmount !== undefined && { defaultAmount: Number(defaultAmount) }),
        ...(frequency && { frequency }),
        ...(isMandatory !== undefined && { isMandatory: Boolean(isMandatory) }),
        ...(description !== undefined && { description: description.trim() }),
        ...(status && { status }),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Invalidate categories cache
    await delCache(CACHE_KEY);

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/finance/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to update fee category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await FeeCategory.findByIdAndDelete(id);

    // Invalidate categories cache
    await delCache(CACHE_KEY);

    return NextResponse.json({ success: true, message: 'Category removed successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/finance/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete fee category' }, { status: 500 });
  }
}
