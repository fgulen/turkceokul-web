import { test, expect } from '@playwright/test';
import { createClassAndGetJoinCode, joinClassWithCode, assertStudentIsInClassRoster, assertStudentCanSeeAssignedBook } from './helpers/classroom-flow';
import { loginAsTeacher } from './helpers/auth';

test.describe('Sınıf akışı regresyon testi', () => {
    test('öğretmen yeni sınıf oluşturur, öğrenci katılır ve kitabı görür', async ({ page }) => {
        const className = `QA Auto ${Date.now()}`;

        const createdClass = await createClassAndGetJoinCode(page, {
            className,
            bookLabel: 'Can Türkçe Ders Kitabı 1 (A1)',
        });

        await joinClassWithCode(page, createdClass.classCode);

        await page.goto('/tr/pano');
        await expect(page.getByRole('heading', { name: /^Selam,/i })).toBeVisible({ timeout: 15_000 });
        await assertStudentCanSeeAssignedBook(page, 'Can Türkçe Ders Kitabı 1');

        await loginAsTeacher(page);
        await page.goto(`/tr/ogretmen/sinif/${createdClass.classId}`);
        await page.getByText(className).waitFor({ timeout: 15_000 });
        await page.getByRole('button', { name: 'Öğrenciler' }).click();
        await assertStudentIsInClassRoster(page, 'Ali');
    })})