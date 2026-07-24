import { expect, Page } from '@playwright/test';
import { loginAsStudent, loginAsTeacher } from './auth';

export type ClassCreateOptions = {
    className: string;
    bookLabel: string;
};

export async function createClassAndGetJoinCode(page: Page, options: ClassCreateOptions) {
    await loginAsTeacher(page);

    await page.getByRole('button', { name: 'Yeni Sınıf' }).first().click();
    await page.getByRole('textbox', { name: /Sınıf adı/ }).fill(options.className);
    await page.getByRole('combobox').selectOption({ label: options.bookLabel });
    await page.getByRole('button', { name: 'Oluştur' }).click();

    await expect(page.getByRole('heading', { name: /Sınıf Oluşturuldu/i })).toBeVisible({ timeout: 15_000 });

    const codeElement = page.locator('.font-mono.font-bold.text-3xl');
    await codeElement.waitFor({ state: 'visible', timeout: 15_000 });
    const classCode = (await codeElement.textContent())?.trim();

    if (!classCode || classCode.length < 4) {
        throw new Error(`Unable to read join code after class creation for "${options.className}"`);
    }

    await page.getByRole('button', { name: 'Tamam' }).click();
    await page.goto('/tr/ogretmen');

    const classLink = page
        .locator('a[href*="/ogretmen/sinif/"]')
        .filter({ hasText: options.className })
        .first();

    await classLink.waitFor({ state: 'visible', timeout: 15_000 });
    const classHref = await classLink.getAttribute('href');
    const classIdMatch = classHref?.match(/\/sinif\/(\d+)/i);

    if (!classIdMatch?.[1]) {
        throw new Error(`Unable to read class id from the teacher dashboard for "${options.className}"`);
    }

    return {
        classCode,
        classId: Number(classIdMatch[1]),
        className: options.className,
    };
}

export async function joinClassWithCode(page: Page, code: string) {
    await loginAsStudent(page);
    await page.goto('/tr/sinif/katil');

    const codeInput = page.locator('input[placeholder="ABCD12"]');
    await codeInput.waitFor({ state: 'visible', timeout: 15_000 });
    await codeInput.fill(code);
    await page.getByRole('button', { name: 'Sınıfa Katıl' }).click();

    await expect(page.getByRole('heading', { name: /Sınıfa katıldın!/i })).toBeVisible({ timeout: 15_000 });
}

export async function assertStudentIsInClassRoster(page: Page, studentName: string) {
    await expect(page.getByText(studentName, { exact: false })).toBeVisible({ timeout: 15_000 });
}

export async function assertStudentCanSeeAssignedBook(page: Page, bookLabel: string) {
    await expect(page.getByRole('link', { name: new RegExp(bookLabel, 'i') })).toBeVisible({ timeout: 15_000 });
}
